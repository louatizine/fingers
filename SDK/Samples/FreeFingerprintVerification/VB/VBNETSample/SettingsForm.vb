Imports System
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Data
Imports System.Drawing
Imports System.Text
Imports System.Windows.Forms

Imports Neurotec.Biometrics
Imports System.Globalization

Namespace VBNETSample
	Partial Public Class SettingsForm
		Inherits Form
		Public Sub New()
			InitializeComponent()

			cbMatchingThreshold.BeginUpdate()
			cbMatchingThreshold.Items.Add(0.001.ToString("P1"))
			cbMatchingThreshold.Items.Add(0.0001.ToString("P2"))
			cbMatchingThreshold.Items.Add(0.00001.ToString("P3"))
			cbMatchingThreshold.EndUpdate()
		End Sub

		Public Sub LoadFromEngine(ByVal engine As Nffv)
			nudQualityThreshold.Value = Convert.ToDecimal(engine.QualityThreshold)
			cbMatchingThreshold.Text = MatchingThresholdToString(engine.MatchingThreshold)
		End Sub

		Public Sub SaveToEngine(ByVal engine As Nffv)
			engine.QualityThreshold = Convert.ToByte(nudQualityThreshold.Value)
			engine.MatchingThreshold = MatchingThresholdFromString(cbMatchingThreshold.Text)
		End Sub

		Private Shared Function MatchingThresholdToString(ByVal value As Integer) As String
			Dim p As Double = -value / 12
			Return String.Format(String.Format("{{0:P{0}}}", Math.Max(0, CInt(Math.Ceiling(-p)) - 2)), Math.Pow(10, p))
		End Function

		Private Shared Function MatchingThresholdFromString(ByVal value As String) As Integer
			Dim p As Double = Math.Log10(Math.Max(Double.Epsilon, Math.Min(1, Double.Parse(value.Replace(CultureInfo.CurrentCulture.NumberFormat.PercentSymbol, "")) / 100)))
			Return Math.Max(0, CInt(Math.Round(-12 * p)))
		End Function

		Private Sub SettingsForm_Validating(ByVal sender As Object, ByVal e As CancelEventArgs) Handles MyBase.Validating
			Try
				MatchingThresholdFromString(cbMatchingThreshold.ValueMember)
			Catch
				errorProvider1.SetError(cbMatchingThreshold, "Matching threshold value is invalid.")
				e.Cancel = True
			End Try
		End Sub
	End Class
End Namespace

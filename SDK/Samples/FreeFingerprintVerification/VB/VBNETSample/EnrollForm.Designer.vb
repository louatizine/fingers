Namespace VBNETSample
	Partial Class EnrollForm
		''' <summary>
		''' Required designer variable.
		''' </summary>
		Private components As System.ComponentModel.IContainer = Nothing

		''' <summary>
		''' Clean up any resources being used.
		''' </summary>
		Protected Overloads Overrides Sub Dispose(ByVal disposing As Boolean)
			If disposing AndAlso (components IsNot Nothing) Then
				components.Dispose()
			End If
			MyBase.Dispose(disposing)
		End Sub

#Region "Windows Form Designer generated code"

		''' <summary>
		''' Required method for Designer support - do not modify
		''' the contents of this method with the code editor.
		''' </summary>
		Private Sub InitializeComponent()
			Me.btnOK = New System.Windows.Forms.Button()
			Me.btnCancel = New System.Windows.Forms.Button()
			Me.label1 = New System.Windows.Forms.Label()
			Me.tbUserName = New System.Windows.Forms.TextBox()
			Me.SuspendLayout()
			' 
			' btnOK
			' 
			Me.btnOK.DialogResult = System.Windows.Forms.DialogResult.OK
			Me.btnOK.Location = New System.Drawing.Point(232, 42)
			Me.btnOK.Name = "btnOK"
			Me.btnOK.Size = New System.Drawing.Size(75, 23)
			Me.btnOK.TabIndex = 2
			Me.btnOK.Text = "OK"
			Me.btnOK.UseVisualStyleBackColor = True
			' 
			' btnCancel
			' 
			Me.btnCancel.DialogResult = System.Windows.Forms.DialogResult.Cancel
			Me.btnCancel.Location = New System.Drawing.Point(313, 42)
			Me.btnCancel.Name = "btnCancel"
			Me.btnCancel.Size = New System.Drawing.Size(75, 23)
			Me.btnCancel.TabIndex = 3
			Me.btnCancel.Text = "Cancel"
			Me.btnCancel.UseVisualStyleBackColor = True
			' 
			' label1
			' 
			Me.label1.AutoSize = True
			Me.label1.Location = New System.Drawing.Point(12, 9)
			Me.label1.Name = "label1"
			Me.label1.Size = New System.Drawing.Size(38, 13)
			Me.label1.TabIndex = 0
			Me.label1.Text = "Name:"
			' 
			' tbUserName
			' 
			Me.tbUserName.Location = New System.Drawing.Point(56, 6)
			Me.tbUserName.Name = "tbUserName"
			Me.tbUserName.Size = New System.Drawing.Size(332, 20)
			Me.tbUserName.TabIndex = 1
			' 
			' EnrollDlg
			' 
			Me.AcceptButton = Me.btnOK
			Me.AutoScaleDimensions = New System.Drawing.SizeF(6.0F, 13.0F)
			Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
			Me.CancelButton = Me.btnCancel
			Me.ClientSize = New System.Drawing.Size(400, 74)
			Me.Controls.Add(Me.tbUserName)
			Me.Controls.Add(Me.label1)
			Me.Controls.Add(Me.btnCancel)
			Me.Controls.Add(Me.btnOK)
			Me.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog
			Me.MaximizeBox = False
			Me.MinimizeBox = False
			Me.Name = "EnrollDlg"
			Me.Padding = New System.Windows.Forms.Padding(9)
			Me.ShowIcon = False
			Me.ShowInTaskbar = False
			Me.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent
			Me.Text = "Enroll"
			Me.ResumeLayout(False)
			Me.PerformLayout()

		End Sub

#End Region

		Private btnOK As System.Windows.Forms.Button
		Private btnCancel As System.Windows.Forms.Button
		Private label1 As System.Windows.Forms.Label
		Private tbUserName As System.Windows.Forms.TextBox

	End Class
End Namespace

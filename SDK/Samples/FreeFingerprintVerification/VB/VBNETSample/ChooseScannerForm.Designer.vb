Imports Microsoft.VisualBasic
Namespace VBNETSample
	Partial Class ChooseScannerForm
		''' <summary>
		''' Required designer variable.
		''' </summary>
		Private components As System.ComponentModel.IContainer = Nothing

		''' <summary>
		''' Clean up any resources being used.
		''' </summary>
		''' <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
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
			Me.clbScannerList = New System.Windows.Forms.CheckedListBox
			Me.btnCancel = New System.Windows.Forms.Button
			Me.btnOK = New System.Windows.Forms.Button
			Me.tbDatabaseName = New System.Windows.Forms.TextBox
			Me.label1 = New System.Windows.Forms.Label
			Me.label2 = New System.Windows.Forms.Label
			Me.label3 = New System.Windows.Forms.Label
			Me.tbUserDatabase = New System.Windows.Forms.TextBox
			Me.tbPassword = New System.Windows.Forms.TextBox
			Me.label4 = New System.Windows.Forms.Label
			Me.SuspendLayout()
			'
			'clbScannerList
			'
			Me.clbScannerList.CheckOnClick = True
			Me.clbScannerList.Location = New System.Drawing.Point(12, 60)
			Me.clbScannerList.Name = "clbScannerList"
			Me.clbScannerList.Size = New System.Drawing.Size(301, 184)
			Me.clbScannerList.TabIndex = 1
			'
			'btnCancel
			'
			Me.btnCancel.DialogResult = System.Windows.Forms.DialogResult.Cancel
			Me.btnCancel.Location = New System.Drawing.Point(238, 364)
			Me.btnCancel.Name = "btnCancel"
			Me.btnCancel.Size = New System.Drawing.Size(75, 23)
			Me.btnCancel.TabIndex = 9
			Me.btnCancel.Text = "Cancel"
			Me.btnCancel.UseVisualStyleBackColor = True
			'
			'btnOK
			'
			Me.btnOK.DialogResult = System.Windows.Forms.DialogResult.OK
			Me.btnOK.Location = New System.Drawing.Point(157, 364)
			Me.btnOK.Name = "btnOK"
			Me.btnOK.Size = New System.Drawing.Size(75, 23)
			Me.btnOK.TabIndex = 8
			Me.btnOK.Text = "OK"
			Me.btnOK.UseVisualStyleBackColor = True
			'
			'tbDatabaseName
			'
			Me.tbDatabaseName.Location = New System.Drawing.Point(124, 259)
			Me.tbDatabaseName.Name = "tbDatabaseName"
			Me.tbDatabaseName.Size = New System.Drawing.Size(189, 20)
			Me.tbDatabaseName.TabIndex = 3
			Me.tbDatabaseName.Text = "FingerprintDB.VBNETSample.dat"
			'
			'label1
			'
			Me.label1.AutoSize = True
			Me.label1.Location = New System.Drawing.Point(12, 262)
			Me.label1.Name = "label1"
			Me.label1.Size = New System.Drawing.Size(106, 13)
			Me.label1.TabIndex = 2
			Me.label1.Text = "Fingerprint database:"
			'
			'label2
			'
			Me.label2.Location = New System.Drawing.Point(12, 9)
			Me.label2.Name = "label2"
			Me.label2.Size = New System.Drawing.Size(301, 48)
			Me.label2.TabIndex = 0
			Me.label2.Text = "Choose scanner modules to load. More modules require more time to load. Some modu" & _
				"les might conflict. It is recommended to use only the modules which are required" & _
				"." & Global.Microsoft.VisualBasic.ChrW(13) & Global.Microsoft.VisualBasic.ChrW(10)
			'
			'label3
			'
			Me.label3.AutoSize = True
			Me.label3.Location = New System.Drawing.Point(39, 328)
			Me.label3.Name = "label3"
			Me.label3.Size = New System.Drawing.Size(79, 13)
			Me.label3.TabIndex = 6
			Me.label3.Text = "User database:"
			'
			'tbUserDatabase
			'
			Me.tbUserDatabase.Location = New System.Drawing.Point(124, 325)
			Me.tbUserDatabase.Name = "tbUserDatabase"
			Me.tbUserDatabase.Size = New System.Drawing.Size(189, 20)
			Me.tbUserDatabase.TabIndex = 7
			Me.tbUserDatabase.Text = "UserDB.VBNETSample.xml"
			'
			'tbPassword
			'
			Me.tbPassword.Location = New System.Drawing.Point(124, 285)
			Me.tbPassword.Name = "tbPassword"
			Me.tbPassword.Size = New System.Drawing.Size(189, 20)
			Me.tbPassword.TabIndex = 5
			Me.tbPassword.UseSystemPasswordChar = True
			'
			'label4
			'
			Me.label4.AutoSize = True
			Me.label4.Location = New System.Drawing.Point(62, 288)
			Me.label4.Name = "label4"
			Me.label4.Size = New System.Drawing.Size(56, 13)
			Me.label4.TabIndex = 4
			Me.label4.Text = "Password:"
			'
			'ChooseScannerForm
			'
			Me.AcceptButton = Me.btnOK
			Me.AutoScaleDimensions = New System.Drawing.SizeF(6.0!, 13.0!)
			Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
			Me.CancelButton = Me.btnCancel
			Me.ClientSize = New System.Drawing.Size(325, 399)
			Me.Controls.Add(Me.label3)
			Me.Controls.Add(Me.tbUserDatabase)
			Me.Controls.Add(Me.label2)
			Me.Controls.Add(Me.label4)
			Me.Controls.Add(Me.label1)
			Me.Controls.Add(Me.tbPassword)
			Me.Controls.Add(Me.tbDatabaseName)
			Me.Controls.Add(Me.btnOK)
			Me.Controls.Add(Me.btnCancel)
			Me.Controls.Add(Me.clbScannerList)
			Me.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog
			Me.MaximizeBox = False
			Me.MinimizeBox = False
			Me.Name = "ChooseScannerForm"
			Me.ShowInTaskbar = False
			Me.Text = "Choose Scanner"
			Me.ResumeLayout(False)
			Me.PerformLayout()

		End Sub

#End Region

		Private clbScannerList As System.Windows.Forms.CheckedListBox
		Private btnCancel As System.Windows.Forms.Button
		Private WithEvents btnOK As System.Windows.Forms.Button
		Private tbDatabaseName As System.Windows.Forms.TextBox
		Private label1 As System.Windows.Forms.Label
		Private label2 As System.Windows.Forms.Label
		Private label3 As System.Windows.Forms.Label
		Private tbUserDatabase As System.Windows.Forms.TextBox
		Private tbPassword As System.Windows.Forms.TextBox
		Private label4 As System.Windows.Forms.Label
	End Class
End Namespace
